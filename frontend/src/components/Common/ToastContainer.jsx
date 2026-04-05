import React from 'react';

const ToastContainer = ({ toasts }) => {
  return (
    <div style={styles.container}>
      {toasts.map(t => (
        <div key={t.id} style={{...styles.toast, borderLeft: `4px solid ${t.type === 'error' ? 'var(--red)' : (t.type === 'info' ? 'var(--blue)' : 'var(--green)')}`}}>
          <span style={styles.icon}>{t.type === 'error' ? '❌' : (t.type === 'info' ? 'ℹ️' : '✅')}</span>
          <span style={styles.msg}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { position: 'fixed', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999 },
  toast: { background: 'var(--surface)', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', animation: 'slideIn 0.3s ease-out', border: '1px solid var(--border)' },
  icon: { fontSize: '18px' },
  msg: { fontSize: '13px', fontWeight: '600' }
};

export default ToastContainer;
