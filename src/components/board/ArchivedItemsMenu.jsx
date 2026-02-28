import { useState, useMemo } from "react";
import { useArchivedLists } from "@/src/hooks/archive/useArchivedLists";
import { useArchivedCards } from "@/src/hooks/archive/useArchivedCards";
import ArchivedCard from "@/src/components/board/ArchivedCard";
import ArchivedList from "@/src/components/board/ArchivedList";

const ArchivedItemsMenu = ({ boardId, setButtonAnchorEl }) => {
  const [buttonText, setButtonText] = useState("Lists");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: archivedCards, isLoading: cardsLoading } = useArchivedCards();
  const { data: archivedLists, isLoading: listsLoading } =
    useArchivedLists(boardId);

  const changeButtonText = () => {
    setButtonText((prev) => (prev === "Lists" ? "Cards" : "Lists"));
    setSearchQuery("");
  };

  const filteredCards = useMemo(() => {
    if (!archivedCards) return [];
    if (!searchQuery.trim()) return archivedCards;
    return archivedCards.filter((c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [archivedCards, searchQuery]);

  const filteredLists = useMemo(() => {
    if (!archivedLists) return [];
    if (!searchQuery.trim()) return archivedLists;
    return archivedLists.filter((l) =>
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [archivedLists, searchQuery]);

  const isShowingCards = buttonText === "Lists";
  const isEmpty = isShowingCards
    ? filteredCards.length === 0
    : filteredLists.length === 0;
  const isLoading = isShowingCards ? cardsLoading : listsLoading;

  return (
    <div className="menu">
      <div className="menu__wrapper px-2 pb-2">
        <div className="menu__rows border-b border-b-[#dcdddd] my-1.5">
          <div className="search-input flex w-full items-center gap-x-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inline-flex w-full h-8 px-3 rounded-sm leading-4 border border-[#8C8F97]"
              placeholder="Search"
            />
            <button
              type="button"
              onClick={changeButtonText}
              className="inline-flex justify-center items-center rounded-sm overflow-hidden cursor-pointer"
            >
              <span className="px-5 py-1 bg-black/20 font-semibold">
                {buttonText}
              </span>
            </button>
          </div>
        </div>
        <div className="menu__rows mt-5 border-b border-b-[#dcdddd] my-1.5">
          {isLoading ? (
            <p>Loading...</p>
          ) : isEmpty ? (
            <p className="text-sm  px-3 py-6 text-center rounded-lg bg-gray-200">
              No results found.
            </p>
          ) : isShowingCards ? (
            <ul className="p-1.5 max-h-[500px] overflow-y-auto">
              {filteredCards.map((c) => (
                <li key={c.id}>
                  <ArchivedCard
                    itemType="cards"
                    data={c}
                    boardId={boardId}
                    setButtonAnchorEl={setButtonAnchorEl}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="p-1.5 max-h-[500px] overflow-y-auto">
              {filteredLists.map((l) => (
                <li key={l.id}>
                  <ArchivedList
                    itemType="lists"
                    data={l}
                    boardId={boardId}
                    setButtonAnchorEl={setButtonAnchorEl}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedItemsMenu;
