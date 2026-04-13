import React from 'react';

const MainConfigDataReviewDialog = ({
  dataReviewDialog,
  selectedFile,
  selectedBlock,
  onClose,
  onConfirm
}) => {
  if (!dataReviewDialog.open) return null;

  return (
    <div className="tut-review-backdrop" onClick={onClose}>
      <div className="tut-review-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tut-review-header">
          <div>
            <h3 className="tut-review-title">Review Data Block Changes</h3>
            <div className="tut-review-subtitle">Xác nhận thay đổi trước khi patch block vào file data.</div>
          </div>
          <div className="tut-review-chip">
            {selectedFile} / {selectedBlock} - {dataReviewDialog.changes.length} changes
          </div>
        </div>

        <div className="tut-review-body">
          {dataReviewDialog.changes.map((change, idx) => {
            const oldLine = `"${change.key}"    "${change.oldValue === '' ? '(empty)' : change.oldValue}"`;
            const newLine = `"${change.key}"    "${change.newValue === '' ? '(empty)' : change.newValue}"`;
            const oldLn = idx + 1;
            const newLn = idx + 1;

            return (
              <div className="tut-review-diff" key={change.key} style={{ marginBottom: 12 }}>
                <div className="tut-review-file">
                  <span>{selectedFile}</span>
                  <span className="tut-review-file-badge">{selectedBlock}</span>
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
          <button className="tut-btn tut-btn-save" onClick={onConfirm}>Confirm Save Data</button>
        </div>
      </div>
    </div>
  );
};

export default MainConfigDataReviewDialog;
