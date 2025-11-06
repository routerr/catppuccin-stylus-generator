import React from 'react';

const Output = ({ output }) => {
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify({ theme: output }, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = "theme.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="output-section">
      <h2>Generated Theme</h2>
      <textarea readOnly value={output} />
      <button onClick={handleDownload} disabled={!output}>Download JSON</button>
    </div>
  );
};

export default Output;
