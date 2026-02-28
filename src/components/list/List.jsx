import { useState, useEffect, useRef, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useChangeListDetail } from "@/src/hooks/list/useChangeListDetail";
import ListHeader from "@/src/components/list/ListHeader";
import ListBody from "@/src/components/list/ListBody";
import ListFooter from "@/src/components/list/ListFooter";
// import { useCards } from "@/src/hooks/card/useCards";
import PopOver from "@/src/components/common/PopOver";
import ListActionsMenu from "@/src/components/list/ListActionsMenu";

const LIST_COLORS = [
  {
    id: 1,
    name: "green",
    cover: "#4BCE97",
    background: "#BAF3DB",
    backgroundHover: "#BAF3DB",
    text: "#164b35",
  },
  {
    id: 2,
    name: "yellow",
    cover: "#EED12B",
    background: "#EFDD4E",
    backgroundHover: "#EFDD4E",
    text: "#533f04",
  },
  {
    id: 3,
    name: "orange",
    cover: "#FCA700",
    background: "#FCE4A6",
    backgroundHover: "#FBD779",
    text: "#5f3811",
  },
  {
    id: 4,
    name: "red",
    cover: "#E05C54",
    background: "#FCDAD8",
    backgroundHover: "#FFB8B2",
    text: "#601e16",
  },
  {
    id: 5,
    name: "purple",
    cover: "#C97CF4",
    background: "#EED7FC",
    backgroundHover: "#E3BDFA",
    text: "#352c63",
  },
  {
    id: 6,
    name: "blue",
    cover: "#669DF1",
    background: "#CFE1FD",
    backgroundHover: "#091e420f",
    text: "#09326c",
  },
  {
    id: 7,
    name: "mint",
    cover: "#6CC3E0",
    background: "#C6EDFB",
    backgroundHover: "#B1E4F7",
    text: "#1d474c",
  },
  {
    id: 8,
    name: "yellowgreen",
    cover: "#94C748",
    background: "#BDE97C",
    backgroundHover: "#BDE97C",
    text: "#37471f",
  },
  {
    id: 9,
    name: "pink",
    cover: "#E774BB",
    background: "#FDD0EC",
    backgroundHover: "#FCB6E1",
    text: "#50253f",
  },
  {
    id: 10,
    name: "gray",
    cover: "#8C8F97",
    background: "#f1f2f4",
    backgroundHover: "#0B120E24",
    text: "#091e42",
  },
];

const List = ({ data, boardId, boardSlug, cards }) => {
  const [activeAddCardArea, setActiveAddCardArea] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const listColor = useMemo(() => {
    return LIST_COLORS.find((c) => c.name === data.color) || LIST_COLORS[0];
  }, [data.color]);

  const addCardTextAreaRef = useRef(null);
  const topAddCardTextAreaRef = useRef(null);
  const addCardRef = useRef(null);
  const topAddCardRef = useRef(null);
  const listRef = useRef(null);

  const { mutate } = useChangeListDetail(boardId, data.id);

  const {
    attributes,
    listeners,
    setNodeRef: setListRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: data.id, data: { type: "LIST", list: data } });

  const style = useMemo(
    () => ({
      transform: transform ? CSS.Translate.toString(transform) : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : "auto",
    }),
    [transform, transition, isDragging],
  );

  function closeAddCardArea() {
    setActiveAddCardArea(null);
  }

  useEffect(() => {
    if (!activeAddCardArea) return;

    const handleClickOutside = (e) => {
      if (
        !listRef.current?.contains(e.target) &&
        !addCardRef.current?.contains(e.target) &&
        !topAddCardRef.current?.contains(e.target)
      ) {
        closeAddCardArea();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeAddCardArea]);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);

  function openAddCardArea(type) {
    setActiveAddCardArea(type);
    const ref = type === "top" ? topAddCardTextAreaRef : addCardTextAreaRef;
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.select();
    }, 0);
  }

  function changeListColor(c) {
    mutate({
      color: c,
    });
  }

  return (
    <div ref={setListRef} style={style}>
      <div ref={listRef} className="board-list inline-flex w-full">
        <div
          style={{
            backgroundColor: listColor.background,
          }}
          className="board-list__wrapper w-full p-2 rounded-lg"
        >
          <ListHeader
            color={listColor}
            attributes={attributes}
            listeners={listeners}
            data={data}
            boardId={boardId}
            handleOpenMenu={handleOpenMenu}
          />
          <ListBody
            color={listColor}
            cards={cards}
            boardSlug={boardSlug}
            addCardRef={topAddCardRef}
            boardId={boardId}
            listId={data.id}
            addCardTextAreaRef={topAddCardTextAreaRef}
            showAddCardArea={activeAddCardArea === "top"}
            openAddCardArea={() => openAddCardArea("top")}
            closeAddCardArea={closeAddCardArea}
          />
          <ListFooter
            color={listColor}
            addCardRef={addCardRef}
            boardId={boardId}
            listId={data.id}
            addCardTextAreaRef={addCardTextAreaRef}
            showAddCardArea={activeAddCardArea === "bottom"}
            openAddCardArea={() => openAddCardArea("bottom")}
            closeAddCardArea={closeAddCardArea}
            activeAddCardArea={activeAddCardArea}
          />
        </div>
      </div>
      {anchorEl && (
        <PopOver
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title={"List actions"}
        >
          <ListActionsMenu
            colors={LIST_COLORS}
            currentColor={listColor.name}
            changeListColor={changeListColor}
            callAddCard={() => {
              setAnchorEl(null);
              openAddCardArea("top");
            }}
            boardId={boardId}
            listId={data.id}
          />
        </PopOver>
      )}
    </div>
  );
};

export default List;
