import { Crosshair } from "lucide-react";
import { CATEGORIES } from "../types";

interface Props {
  category: string;
  onCategoryChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  radius: number;
  onRadiusChange: (v: number) => void;
  searching: boolean;
  onSearch: () => void;
  semSiteCount: number;
  enriquecidosCount: number;
  onImportOverpass?: (location: string, category: string | null) => void;
  importing?: boolean;
}

export default function SearchCard({
  category,
  onCategoryChange,
  location,
  onLocationChange,
  radius,
  onRadiusChange,
  searching,
  onSearch,
  semSiteCount,
  enriquecidosCount,
  onImportOverpass,
  importing = false,
}: Props) {
  return (
    <div className="search-card">
      <div className="field">
        <label htmlFor="categoria">Categoria</label>
        <select
          id="categoria"
          className="input"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="localizacao">Localização</label>
        <input
          id="localizacao"
          className="input"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          list="cities-list"
          placeholder="Ex: Itapoá, SC"
        />
        <datalist id="cities-list">
          <option value="Itapoá, SC" />
          <option value="Porto Alegre, RS" />
          <option value="Canoas, RS" />
          <option value="Novo Hamburgo, RS" />
          <option value="Rio de Janeiro, RJ" />
          <option value="São Paulo, SP" />
          <option value="Belo Horizonte, MG" />
          <option value="Curitiba, PR" />
          <option value="Salvador, BA" />
          <option value="Fortaleza, CE" />
        </datalist>
      </div>

      <div className="field">
        <label htmlFor="raio">Raio</label>
        <div className="search-card-slider-row">
          <input
            id="raio"
            type="range"
            min={2}
            max={40}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
          />
        </div>
        <div className="search-card-slider-row">
          <span />
          <span className="value">{radius} km</span>
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={onSearch} disabled={searching}>
        <Crosshair size={14} /> {searching ? "Buscando…" : "Buscar leads sem site"}
      </button>

      {onImportOverpass && (
        <button
          className="btn btn-secondary btn-block"
          onClick={() => onImportOverpass(location, category || null)}
          disabled={importing}
        >
          🗺️ {importing ? "Importando…" : "Importar do OpenStreetMap"}
        </button>
      )}

      <div className="search-card-footer">
        <b>{semSiteCount}</b> sem site no raio · <b>{enriquecidosCount}</b> enriquecidos
      </div>
    </div>
  );
}
