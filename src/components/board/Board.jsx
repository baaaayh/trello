import { useState, useEffect } from "react";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import List from "@/src/components/list/List";
import AddListButton from "@/src/components/board/AddListButton";
import { supabase } from "@/src/lib/supabaseClient";
const Board = ({ data }) => {
  const { isLoading, listIds, lists, boardId, boardSlug, lastPosition } = data;

  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("test-lists-direct")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        (payload) => {
          console.log("lists 직접 테스트!!!", payload);
        },
      )
      .subscribe((status) => console.log("lists 직접 상태:", status));

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="board">
      {isLoading ? null : (
        <ul className="inline-flex">
          <SortableContext
            items={listIds}
            strategy={horizontalListSortingStrategy}
          >
            {lists.map(
              (list) =>
                !list.is_archived && (
                  <li
                    id={list.id ? list.id : "temp-list"}
                    key={list.id}
                    className="px-2 w-[272px]"
                  >
                    <List
                      data={list}
                      boardId={boardId}
                      boardSlug={boardSlug}
                      cards={list.cards}
                    />
                  </li>
                ),
            )}
          </SortableContext>

          <AddListButton
            isShow={isShow}
            setIsShow={setIsShow}
            boardId={boardId}
            lastPosition={lastPosition}
          />
        </ul>
      )}
    </div>
  );
};

export default Board;
