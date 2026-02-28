import MenuIcon from "@/src/components/common/icons/MenuIcon";
import LogoDefault from "@/src/components/common/icons/LogoDefault";
import LogoWhite from "@/src/components/common/icons/LogoWhite";
import HeaderUserButton from "@/src/components/layout/HeaderUserButtonItem";
import ZoomIcon from "@/src/components/common/icons/ZoomIcon";
import TwinkleIcon from "@/src/components/common/icons/TwinkleIcon";
import NoticeIcon from "@/src/components/common/icons/NoticeIcon";
import AlarmIcon from "@/src/components/common/icons/AlarmIcon";
import InfoIcon from "@/src/components/common/icons/InfoIcon";

const getHeaderUserMenu = (divide) => {
  const iconColor = divide ? "#505258" : "#fff";
  return [
    {
      icon: <NoticeIcon w={16} h={16} color={iconColor} />,
      text: "Notice",
    },
    {
      icon: <AlarmIcon w={24} h={24} color={iconColor} />,
      text: "Alarm",
    },
    {
      icon: <InfoIcon w={20} h={20} color={iconColor} />,
      text: "Info",
    },
  ];
};

const Header = ({ divide }) => {
  const HeaderUserMenu = getHeaderUserMenu(divide);
  return (
    <header
      className={`header transition-colors duration-300 ${
        divide ? "bg-white" : "bg-[#473699]"
      }`}
    >
      <div className="header__wrapper flex justify-between items-center p-2">
        <div className="logo-area inline-flex items-center">
          <button
            type="button"
            className="menu-button inline-flex px-1 cursor-pointer"
          >
            <span className="menu-button__icon text-[0px]">
              <MenuIcon color={divide ? "#505258" : "#fff"} />
              MENU
            </span>
          </button>
          <h1 className="logo">
            <a href="/">{divide ? <LogoDefault /> : <LogoWhite />}</a>
          </h1>
        </div>
        <div className="search-box max-w-[860px] w-full">
          <div className="search-box__wrapper w-full inline-flex gap-x-3 justify-between items-center">
            <div className="search-box__input relative w-full pr-4 pl-8 border border-[#6B6E76] rounded-md bg-white/30">
              <span className="zoom-icon absolute top-1/2 left-2 -translate-y-1/2 inline-flex w-4 h-4">
                <ZoomIcon color={divide ? "#505258" : "#fff"} />
              </span>
              <input
                type="text"
                placeholder="Search"
                className={`search-input w-full h-8 leading-8 ${
                  divide
                    ? "placeholder-[#505258] text-gray-600"
                    : "placeholder-white  text-white"
                }`}
              />
            </div>
            <button
              type="button"
              className={`search-button px-3 rounded-md cursor-pointer ${divide ? "bg-[#1868DB]" : "bg-white/30"}`}
            >
              <span className="inline-block leading-8 text-sm font-bold text-white">
                Create
              </span>
            </button>
          </div>
        </div>
        <div className="user">
          <ul className="inline-flex justify-between items-center gap-x-2">
            {HeaderUserMenu.map((item, index) => (
              <li key={index} className="inline-flex align-center">
                <HeaderUserButton
                  icon={item.icon}
                  text={item.text}
                  divide={divide}
                />
              </li>
            ))}
            <li className="inline-flex align-center">
              <button
                type="button"
                className="user-button inline-flex align-top cursor-pointer"
              >
                <span className="user-button__icon inline-flex w-6 h-6 bg-[url('@/src/assets/icon/icon_user.png')] bg-contain bg-center text-[0px]">
                  User
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
