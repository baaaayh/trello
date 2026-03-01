const ACTION_LABELS = {
  "card.created": "카드를 생성했습니다",
  "card.created.inbox": "인박스에 카드를 생성했습니다",
  "card.moved": (m) =>
    `${m.from_list_title} → ${m.to_list_title} 으로 이동했습니다`,
  "card.reordered": "카드 순서를 변경했습니다",
  "card.completed": "카드를 완료 처리했습니다",
  "card.uncompleted": "카드 완료를 취소했습니다",
  "card.archived": "카드를 보관했습니다",
  "card.unarchived": "카드를 복원했습니다",
  "card.updated.title": (m) =>
    `제목을 "${m.old}" → "${m.new}" 으로 변경했습니다`,
  "card.updated.desc": "설명을 변경했습니다",
  "card.inbox.transferred.in": "카드를 인박스로 이동했습니다",
  "card.inbox.transferred.out": (m) =>
    `인박스에서 ${m.to_list_title} 으로 이동했습니다`,
  "card.inbox.transferred.inner": () => `인박스 내에서 순서를 변경했습니다.`,
  "card.inbox.reordered": "인박스 내 순서를 변경했습니다",
};

function formatAction(action, metadata) {
  const label = ACTION_LABELS[action];
  if (!label) return action;
  return typeof label === "function" ? label(metadata) : label;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const ModalActivityText = ({ item }) => {
  const { action, metadata, created_at, user_name } = item;
  return (
    <div className="activity-text">
      <div className="activity-text__top flex justify-start items-center gap-x-2">
        <b className="text-[15px]">{user_name ?? "알 수 없음"}</b>
        <p className="text-[14px]">{formatAction(action, metadata)}</p>
      </div>
      <div className="activity-text__bottom text-xs text-[#0c66e4]">
        {formatDate(created_at)}
      </div>
    </div>
  );
};

export default ModalActivityText;
