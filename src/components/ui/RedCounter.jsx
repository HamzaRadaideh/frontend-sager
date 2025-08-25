// components/ui/RedCounter.jsx
import React, { useEffect, useState } from "react";
import { useDroneStore } from "../../store/droneStore";

export default function RedCounter() {
  const redCountFn = useDroneStore((state) => state.redCount);
  const [count, setCount] = useState(redCountFn());

  useEffect(() => {
    const unsubscribe = useDroneStore.subscribe(() => {
      setCount(redCountFn());
    });

    return () => unsubscribe();
  }, [redCountFn]);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full px-4 py-2 border border-gray-600 shadow-lg z-10">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">
          <span className="font-bold">{count}</span> Drone Flying
        </span>
      </div>
    </div>
  );
}