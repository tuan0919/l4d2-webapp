import React from 'react';

const CvarReviewDialog = ({ reviewDialog, onClose, onConfirm }) => {
  if (!reviewDialog.open) return null;

  return (
    <div className="tut-review-backdrop" onClick={onClose}>
      <div className="tut-review-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tut-review-header">
          <div>
            <h3 className="tut-review-title">Review Changes Before Save</h3>
            <div className="tut-review-subtitle">Xác nhận thay đổi CVAR trước khi ghi vào file config.</div>
          </div>
          <div className="tut-review-chip">{reviewDialog.sectionLabel} - {reviewDialog.changes.length} changes</div>
        </div>

        <div className="tut-review-body">
          {reviewDialog.changes.map((change, idx) => {
            const oldLine = `sm_cvar ${change.cvar} "${change.oldValue === '' ? '(empty)' : change.oldValue}"`;
            const newLine = `sm_cvar ${change.cvar} "${change.newValue === '' ? '(empty)' : change.newValue}"`;
            const oldLn = idx + 1;
            const newLn = idx + 1;

            return (
              <div className="tut-review-diff" key={change.cvar} style={{ marginBottom: 12 }}>
                <div className="tut-review-file">
                  <span>{change.sourcePath || '(unknown file)'}</span>
                  <span className="tut-review-file-badge">{change.cvar}</span>
                </div>

                <div className="tut-review-lines">
                  <div className="tut-review-line tut-review-line-old">
                    <div className="tut-review-ln">{oldLn}</div>
                    <div className="tut-review-ln"></div>
                    <div className="tut-review-sign">-</div>
                    <div className="tut-review-code">{oldLine}</div>
                  </div>
                  <div className="tut-review-line tut-review-line-new">
                    <div className="tut-review-ln"></div>
                    <div className="tut-review-ln">{newLn}</div>
                    <div className="tut-review-sign">+</div>
                    <div className="tut-review-code">{newLine}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="tut-review-actions">
          <button className="tut-btn tut-btn-refresh" onClick={onClose}>Cancel</button>
          <button className="tut-btn tut-btn-save" onClick={onConfirm}>Confirm Save</button>
        </div>
      </div>
    </div>
  );
};

export default CvarReviewDialog;
