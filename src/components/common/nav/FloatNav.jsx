import useDivideStatusStore from "@/src/store/useDivideStatusStore";
import FloatNavButton from "@/src/components/common/nav/FloatNavButton";

const FloatNav = ({ menuData }) => {
  const { divideStatus, setDivideStatus } = useDivideStatusStore();

  const handleToggle = (text) => {
    const key = text.toLowerCase(); // "Inbox" -> "inbox"
    if (key in divideStatus) {
      // 현재 상태의 반대값으로 업데이트
      setDivideStatus(key, !divideStatus[key]);
    }
  };

  return (
    <nav className="absolute bottom-6 float-nav inline-flex rounded-xl bg-white shadow-lg overflow-hidden pointer-events-auto">
      <div className="float-name__wrapper border p-1.5 border-nav-border/15">
        {menuData.map((list, i) => (
          <div key={i} className="nav-list">
            <ul className="inline-flex justify-between gap-x-1.5">
              {list.map((button, j) => {
                const key = button.text.toLowerCase();
                const isActive = divideStatus[key];

                return (
                  <li key={j}>
                    <FloatNavButton
                      icon={button.icon}
                      text={button.text}
                      isActive={isActive}
                      onClick={() => handleToggle(button.text)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default FloatNav;
