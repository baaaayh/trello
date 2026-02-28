import ArchiveIcon from "@/src/components/common/icons/ArchiveIcon";

const BoardMenu = ({ handleOpenArchivedItems }) => {
  return (
    <div className="menu">
      <div className="menu__wrapper px-2 pb-2">
        <div className="menu__rows border-b border-b-[#dcdddd] my-1.5">
          <ul className="-mx-2">
            <li>
              <button
                type="button"
                className="menu-button flex w-full py-1.5 px-3 hover:bg-gray-200 cursor-pointer"
                onClick={handleOpenArchivedItems}
              >
                <div className="menu-button__wrapper flex items-center w-full gap-x-2">
                  <span className="menu-button__icon inline-flex justify-center items-center w-5 h-5">
                    <ArchiveIcon />
                  </span>
                  <span className="menu-button__text text-sm">
                    Archived Items
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default BoardMenu;
