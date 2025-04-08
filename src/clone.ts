/** clone element style */
function cloneStyle<T extends Element>(target: T, origin: T) {
  const style = window.getComputedStyle(origin, null);
  let styleText = '';
  for (let index = 0; index < style.length; index++) {
    const value = style.getPropertyValue(style[index]);
    if (value) styleText += `${style[index]}:${value};`;
  }

  target.setAttribute('style', styleText);
}

/** clone canvas */
function cloneCanvas<T extends HTMLCanvasElement>(target: T, origin: T) {
  target.getContext('2d')?.drawImage(origin, 0, 0);
}

export function cloneNode(target: Node, origin: Node) {
  cloneStyle(target as Element, origin as Element);
  if (target.nodeName === 'CANVAS') cloneCanvas(target as HTMLCanvasElement, origin as HTMLCanvasElement);
}
