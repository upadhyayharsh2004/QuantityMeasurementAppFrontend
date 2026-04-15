import React from 'react';

/**
 * Reusable result display component.
 * Props:
 *  result: { val: string, meta: string, isError: boolean } | null
 */
export default function ResultBox({ result }) {
  if (!result) return null;

  return (
    <div className={`result-box${result.isError ? ' error' : ''}`}>
      <div className="result-label">Result</div>
      <div className={`result-value${result.isError ? ' error' : ''}`}>
        {result.val}
      </div>
      {result.meta && <div className="result-meta">{result.meta}</div>}
    </div>
  );
}
