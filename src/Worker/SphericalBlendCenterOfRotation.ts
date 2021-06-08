interface InputData {
  vertexCount: number;
  skinIndexArray: number[];
  
}

self.onmessage = ({ data: { vertexCount } }: { data: InputData }) => {
  self.postMessage({
    answer: 42,
  });
};
