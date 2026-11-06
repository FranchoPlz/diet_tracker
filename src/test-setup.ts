// jsdom's Blob lacks arrayBuffer(); every supported browser has it.
Blob.prototype.arrayBuffer ??= function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(this);
  });
};
