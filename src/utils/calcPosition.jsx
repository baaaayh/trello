const GAP = 65536;

export const calcPosition = (items, newIndex, field = "position") => {
  const prev = items[newIndex - 1];
  const next = items[newIndex];

  // console.log(items, prev, next);

  // 1. 아무것도 없을 때
  if (!prev && !next) return GAP;
  // 2. 가장 앞에 놓일 때
  if (!prev) return next[field] / 2;
  // 3. 가장 뒤에 놓일 때
  if (!next) return prev[field] + GAP;
  // 4. 사이 공간에 놓일 때
  return (prev[field] + next[field]) / 2;
};
