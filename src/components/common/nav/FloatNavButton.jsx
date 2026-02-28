const FloatNavButton = ({ icon, text, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`nav-button cursor-pointer rounded-lg transition-colors ${
      isActive ? "bg-[#e9f2ff] shadow-inner" : "hover:bg-black/5"
    }`}
  >
    <div className="nav-button__wrapper inline-flex px-3 py-1.5 items-center gap-x-2 text-[#292a2e]">
      <span
        className={`nav-button__icon inline-flex w-4 h-4 ${isActive ? "text-[#0c66e4] opacity-100" : "opacity-50"}`}
      >
        {icon}
      </span>
      <span
        className={`nav-button__text text-base font-semibold ${isActive ? "text-[#0c66e4]" : ""}`}
      >
        {text}
      </span>
    </div>
  </button>
);

export default FloatNavButton;
