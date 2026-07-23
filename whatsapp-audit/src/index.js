const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const ROOT = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const TEST_SEQUENCE = require('./testSequence');

const DRY_RUN = process.argv.includes('--dry-run');

const leadsPath = path.join(ROOT, config.paths.leadsFile);
const resultsPath = path.join(ROOT, config.paths.resultsFile);
const audioPath = path.join(ROOT, config.paths.audioTestFile);

const RESULT_HEADER = [
  'timestamp', 'company_name', 'whatsapp', 'business_type', 'city',
  'test_label', 'message_sent', 'reply_received', 'reply_wait_seconds',
  'reply_text', 'likely_bot', 'manual_review'
];

function loadLeads() {
  if (!fs.existsSync(leadsPath)) {
    throw new Error(`Leads file not found at ${leadsPath}. See README for the expected format.`);
  }
  const raw = fs.readFileSync(leadsPath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

function loadTestedNumbers() {
  if (!fs.existsSync(resultsPath)) return new Set();
  const raw = fs.readFileSync(resultsPath, 'utf8');
  if (!raw.trim()) return new Set();
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  return new Set(rows.map(r => r.whatsapp));
}

function appendResult(row) {
  const exists = fs.existsSync(resultsPath);
  const line = stringify([row], { header: !exists, columns: RESULT_HEADER });
  fs.appendFileSync(resultsPath, line);
}

function randomDelayMs(minS, maxS) {
  return (minS + Math.random() * (maxS - minS)) * 1000;
}

function withinActiveHours() {
  const h = new Date().getHours();
  return h >= config.safety.activeHours.start && h < config.safety.activeHours.end;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDryRun(leads, tested) {
  console.log(`[dry-run] ${leads.length} leads loaded, ${tested.size} already tested previously.`);
  if (!withinActiveHours()) {
    console.log('[dry-run] NOTE: current time is outside the configured active hours window — a live run would stop early or wait.');
  }
  let count = 0;
  for (const lead of leads) {
    if (!lead.whatsapp || tested.has(lead.whatsapp)) continue;
    if (count >= config.safety.maxTestsPerDay) break;
    count++;
    console.log(`\n[dry-run] Would test: ${lead.company_name || '(no name)'} (${lead.whatsapp})`);
    for (const t of TEST_SEQUENCE) {
      const preview = t.type === 'text' ? t.body : `(audio file: ${config.paths.audioTestFile})`;
      console.log(`  -> [${t.label}] ${preview}`);
    }
  }
  console.log(`\n[dry-run] Total would-test today: ${count}. Nothing was sent, no WhatsApp connection was made.`);
  if (count > 0 && !fs.existsSync(audioPath)) {
    console.log(`[dry-run] WARNING: audio test file not found at ${audioPath} — the audio test would fail on a live run. See README.`);
  }
}

async function runLive(leads, tested) {
  const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  if (!fs.existsSync(audioPath)) {
    console.log(`WARNING: no audio file found at ${audioPath}. The audio test will be skipped until you add one (see README).`);
  }

  const client = new Client({ authStrategy: new LocalAuth() });
  const pendingReplies = new Map(); // chatId -> resolver

  client.on('qr', qr => {
    console.log('\nScan this with WhatsApp on your TEST number (Linked Devices):\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('message', msg => {
    const resolver = pendingReplies.get(msg.from);
    if (resolver) {
      pendingReplies.delete(msg.from);
      resolver(msg);
    }
  });

  await new Promise((resolve, reject) => {
    client.on('ready', resolve);
    client.on('auth_failure', reject);
    client.initialize();
  });

  console.log('WhatsApp session ready.\n');

  let count = 0;
  for (const lead of leads) {
    if (!lead.whatsapp || tested.has(lead.whatsapp)) continue;

    if (count >= config.safety.maxTestsPerDay) {
      console.log('Daily cap reached. Run again (later today or tomorrow) to continue with the rest of the list.');
      break;
    }
    if (!withinActiveHours()) {
      console.log('Outside the configured active-hours window. Stopping here — rerun during business hours.');
      break;
    }

    count++;
    const digits = lead.whatsapp.replace(/\D/g, '');
    const chatId = `${digits}@c.us`;
    console.log(`[${count}/${config.safety.maxTestsPerDay}] Testing ${lead.company_name || chatId} (${chatId})`);

    for (const test of TEST_SEQUENCE) {
      if (test.type === 'audio' && !fs.existsSync(audioPath)) {
        console.log(`  skipping [${test.label}] — no audio file at ${audioPath}`);
        continue;
      }

      const gapMs = randomDelayMs(config.safety.gapBetweenMessagesSeconds.min, config.safety.gapBetweenMessagesSeconds.max);
      await sleep(gapMs);

      if (config.safety.simulateTyping) {
        const chat = await client.getChatById(chatId).catch(() => null);
        if (chat) {
          await chat.sendStateTyping().catch(() => {});
          await sleep(1500);
        }
      }

      const sentAt = Date.now();
      try {
        if (test.type === 'text') {
          await client.sendMessage(chatId, test.body);
        } else if (test.type === 'audio') {
          const media = MessageMedia.fromFilePath(audioPath);
          await client.sendMessage(chatId, media, { sendAudioAsVoice: true });
        }
      } catch (err) {
        console.log(`  ! failed to send [${test.label}]: ${err.message}`);
        appendResult({
          timestamp: new Date().toISOString(), company_name: lead.company_name, whatsapp: lead.whatsapp,
          business_type: lead.business_type, city: lead.city, test_label: test.label,
          message_sent: 'SEND_FAILED', reply_received: '', reply_wait_seconds: '', reply_text: '',
          likely_bot: '', manual_review: ''
        });
        continue;
      }

      console.log(`  sent [${test.label}], waiting up to ${config.safety.replyWaitSeconds}s for a reply...`);

      const reply = await new Promise(resolve => {
        const timeout = setTimeout(() => {
          pendingReplies.delete(chatId);
          resolve(null);
        }, config.safety.replyWaitSeconds * 1000);
        pendingReplies.set(chatId, msg => {
          clearTimeout(timeout);
          resolve(msg);
        });
      });

      const waitSeconds = reply ? ((Date.now() - sentAt) / 1000).toFixed(1) : '';
      appendResult({
        timestamp: new Date().toISOString(),
        company_name: lead.company_name,
        whatsapp: lead.whatsapp,
        business_type: lead.business_type,
        city: lead.city,
        test_label: test.label,
        message_sent: test.type === 'text' ? test.body : '[audio]',
        reply_received: reply ? 'yes' : 'no',
        reply_wait_seconds: waitSeconds,
        reply_text: reply ? (reply.body || '[non-text reply]') : '',
        likely_bot: reply ? (Number(waitSeconds) < 15 ? 'likely' : 'unclear') : '',
        manual_review: ''
      });

      console.log(reply ? `  reply in ${waitSeconds}s: ${reply.body || '[non-text]'}` : '  no reply within window.');
    }

    tested.add(lead.whatsapp);
  }

  console.log('\nDone for this run.');
  process.exit(0);
}

(async () => {
  try {
    const leads = loadLeads();
    const tested = loadTestedNumbers();
    if (DRY_RUN) {
      await runDryRun(leads, tested);
    } else {
      await runLive(leads, tested);
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
})();
