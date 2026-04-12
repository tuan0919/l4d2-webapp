import React from 'react';

const normalizeCsvToken = (token) => String(token || '').trim().toLowerCase();

const splitCsvValue = (rawValue) => String(rawValue || '')
  .split(',')
  .map((token) => token.trim())
  .filter(Boolean);

const buildCsvValue = (rawValue, optionValue, checked, options) => {
  const optionMap = new Map(options.map((option) => [normalizeCsvToken(option.v), String(option.v)]));
  const recognized = new Set();
  const extras = [];

  splitCsvValue(rawValue).forEach((token) => {
    const key = normalizeCsvToken(token);
    if (optionMap.has(key)) {
      recognized.add(key);
    } else {
      extras.push(token);
    }
  });

  const targetKey = normalizeCsvToken(optionValue);
  if (checked) {
    recognized.add(targetKey);
  } else {
    recognized.delete(targetKey);
  }

  const ordered = options
    .filter((option) => recognized.has(normalizeCsvToken(option.v)))
    .map((option) => String(option.v));

  return [...ordered, ...extras].join(',');
};

const CvarField = ({
  item,
  value,
  sourcePath,
  onUpdate,
  onMultiCheckbox,
  isMultiCheckboxChecked
}) => {
  if (!item) return null;
  const selectedCsv = item.type === 'csv-checkbox'
    ? new Set(splitCsvValue(value).map(normalizeCsvToken))
    : null;

  return (
    <div className="tut-item" key={item.cvar}>
      <div className="tut-label">
        {item.label}
        {item.type === 'toggle' && (
          <label className="tut-switch">
            <input
              type="checkbox"
              checked={String(value) === '1'}
              onChange={(e) => onUpdate(item.cvar, e.target.checked ? '1' : '0')}
            />
            <span className="tut-switch-slider"></span>
          </label>
        )}
      </div>

      <div className="tut-desc">{item.desc}</div>
      {sourcePath && (
        <div className="tut-desc" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--blue)' }}>
          {sourcePath}
        </div>
      )}

      {item.type === 'number' && (
        <input
          type="number"
          className="tut-input"
          value={value}
          onChange={(e) => onUpdate(item.cvar, e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}

      {item.type === 'text' && (
        <input
          type="text"
          className="tut-input"
          value={value}
          onChange={(e) => onUpdate(item.cvar, e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}

      {item.type === 'select' && (
        <select
          className="tut-input"
          value={value}
          onChange={(e) => onUpdate(item.cvar, e.target.value)}
          style={{ marginTop: 8 }}
        >
          {item.options.map((option) => (
            <option key={option.v} value={option.v}>{option.n}</option>
          ))}
        </select>
      )}

      {item.type === 'radio' && (
        <div className="tut-radio-group" style={{ marginTop: 8 }}>
          {item.options.map((option) => (
            <label className="tut-radio" key={option.v}>
              <input
                type="radio"
                value={option.v}
                checked={String(value) === String(option.v)}
                onChange={(e) => onUpdate(item.cvar, e.target.value)}
              />
              {option.n}
            </label>
          ))}
        </div>
      )}

      {item.type === 'multi-checkbox' && (
        <div className="tut-checkbox-group" style={{ marginTop: 8 }}>
          {item.options.map((option) => (
            <label className="tut-checkbox" key={option.v}>
              <input
                type="checkbox"
                checked={isMultiCheckboxChecked(item.cvar, option.v)}
                onChange={(e) => onMultiCheckbox(item.cvar, option.v, e.target.checked)}
              />
              {option.n}
            </label>
          ))}
        </div>
      )}

      {item.type === 'csv-checkbox' && (
        <div className="tut-checkbox-group" style={{ marginTop: 8 }}>
          {item.options.map((option) => (
            <label className="tut-checkbox" key={option.v}>
              <input
                type="checkbox"
                checked={selectedCsv?.has(normalizeCsvToken(option.v))}
                onChange={(e) => onUpdate(
                  item.cvar,
                  buildCsvValue(value, option.v, e.target.checked, item.options)
                )}
              />
              {option.n}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default CvarField;
