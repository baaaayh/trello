const HeaderUserButton = ({ w, h, icon, text }) => (
  <button type="button" className="user-button inline-flex cursor-pointer">
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className="user-button__icon inline-flex justify-center items-center text-[0px] text-white"
    >
      {icon}
      {text}
    </span>
  </button>
);
export default HeaderUserButton;
