import { useEffect, useState } from 'react';
import api from '../api';

/**
 * Cascading District + Assembly selector.
 * `district` and `assembly` are controlled values; the parent supplies
 * setters via `onChange({ district, assembly })`. Pass `allowEmpty` for
 * filter usage (adds an "All" option).
 */
export default function DistrictAssemblySelect({
  district = '',
  assembly = '',
  onChange,
  allowEmpty = false,
  required = false,
  labels = { district: 'District', assembly: 'Assembly' },
}) {
  const [map, setMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/districts')
      .then((r) => setMap(r.data.map || {}))
      .finally(() => setLoading(false));
  }, []);

  const districts = Object.keys(map).sort((a, b) => a.localeCompare(b));
  const assemblies = district ? map[district] || [] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">{labels.district}{required && ' *'}</label>
        <select
          className="input"
          value={district}
          onChange={(e) => onChange({ district: e.target.value, assembly: '' })}
          disabled={loading}
          required={required}
        >
          {allowEmpty && <option value="">All districts</option>}
          {!allowEmpty && !district && <option value="">— Select —</option>}
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{labels.assembly}{required && ' *'}</label>
        <select
          className="input"
          value={assembly}
          onChange={(e) => onChange({ district, assembly: e.target.value })}
          disabled={!district || loading}
          required={required}
        >
          {allowEmpty && <option value="">All assemblies</option>}
          {!allowEmpty && !assembly && <option value="">— Select —</option>}
          {assemblies.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
