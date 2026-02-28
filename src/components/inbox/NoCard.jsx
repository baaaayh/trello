import LockIcon from "@/src/components/common/icons/LockIcon";

const NoCard = () => {
  return (
    <div className="flex flex flex-col flex-1 py-8 px-4">
      <div className="top flex flex-col items-center flex-1">
        <b>Consolidate your to-dos</b>
        <p className="text-sm py-2 leading-lg">
          Email it, say it, forward it — however it comes, get it into Trello
          fast.
        </p>
      </div>
      <div className="bottom">
        <p className="flex justify-center items-center gap-x-2 text-[#172B4D] ">
          <span className="inline-flex justify-center items-center w-4 h-4">
            <LockIcon color="#172B4D" />
          </span>
          Inbox is only visible to you
        </p>
      </div>
    </div>
  );
};

export default NoCard;
