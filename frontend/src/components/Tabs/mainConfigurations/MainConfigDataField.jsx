import React from 'react';

const MainConfigDataField = ({ item, value, onUpdate }) => {
  if (!item) return null;

  return (
    <div className="tut-item" key={item.key}>
      <div className="tut-label">{item.label}</div>
      <div className="tut-desc">{item.desc}</div>

      {item.type === 'toggle' ? (
        <label className="tut-switch" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={String(value) === '1'}
            onChange={(e) => onUpdate(item.key, e.target.checked ? '1' : '0')}
          />
          <span className="tut-switch-slider"></span>
        </label>
      ) : (
        <input
          type="number"
          step="any"
          className="tut-input"
          value={value}
          onChange={(e) => onUpdate(item.key, e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};

export default MainConfigDataField;
