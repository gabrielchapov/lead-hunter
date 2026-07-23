// The four test messages sent to each lead, in order.
// These map to the failure modes that show up constantly in real complaints
// about WhatsApp AI attendants: no audio handling, no memory between messages,
// and rigid menu-locking on multi-topic messages.
//
// Edit `body` text to fit the vertical you're testing (e.g. swap [servico A]/
// [servico B] for something real to that business type) — keep the *shape*
// of each test the same, since that's what makes the failure comparable
// across leads.

module.exports = [
  {
    type: 'text',
    label: 'saudacao simples',
    body: 'Oi, boa tarde! Voces estao atendendo agora?'
  },
  {
    type: 'audio',
    label: 'mensagem de audio'
    // sent from config.paths.audioTestFile — see README for how to record one
  },
  {
    type: 'text',
    label: 'pedido antigo inexistente',
    body: 'Ah, sobre aquele pedido que eu fiz mes passado, ja ficou pronto?'
  },
  {
    type: 'text',
    label: 'dois assuntos misturados',
    body: 'Voces fazem [servico A] e tambem [servico B]? Qual o preco dos dois e voces tem garantia?'
  }
];
