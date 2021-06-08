declare module "typedarray-to-buffer" {
  declare function toBuffer<T>(arr: ArrayLike<T>): Buffer;
  export default toBuffer;
}
