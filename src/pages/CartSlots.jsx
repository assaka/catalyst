import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, EyeOff, GripVertical } from "lucide-react";

function SlotWrapper({ children, isEditing, onEditCancel }) {
  return (
      <div className="relative p-4 border rounded bg-white shadow-lg">
        {children}
        {isEditing && (
            <button
                onClick={onEditCancel}
                className="absolute top-2 right-2 z-20 px-2 py-1 bg-red-200 rounded hover:bg-red-300 text-sm"
            >
              Cancel
            </button>
        )}
      </div>
  );
}

function EditableSlot({ title, content, onChange, isEditing, onCancel }) {
  return (
      <SlotWrapper isEditing={isEditing} onEditCancel={onCancel}>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {isEditing ? (
            <textarea
                className="w-full p-2 border rounded"
                value={content}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                onPointerDown={(e) => e.stopPropagation()}
            />
        ) : (
            <p>{content}</p>
        )}
      </SlotWrapper>
  );
}

function SortableItem({
                        id,
                        children,
                        draggable = true,
                        onEdit,
                        onHide,
                        isEditing
                      }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative mb-4 group"
      >
        {draggable && (
            <button
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
                className="absolute left-2 top-6 z-10 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Drag handle"
            >
          <GripVertical size={20} />
        </button>
        )}

        {/* Edit and Hide buttons */}
        <div className="absolute right-2 top-6 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(id)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onHide(id)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Hide"
          >
            <EyeOff size={16} />
          </button>
        </div>

        {children}
      </div>
  );
}

const defaultSlots = [
  { id: "header", title: "Header", draggable: false },
  { id: "cartItems", title: "Cart Items", draggable: true },
  { id: "coupon", title: "Coupon", draggable: true },
  { id: "orderSummary", title: "Order Summary", draggable: true },
  { id: "recommended", title: "Recommended Products", draggable: true },
];

export default function CartSlots() {
  // Add basic store context check
  const storeCode = window.location.pathname.split('/')[2] || 'demo';

  const [order, setOrder] = useState(() => {
    const saved = localStorage.getItem("slotOrder");
    return saved ? JSON.parse(saved) : defaultSlots.map((s) => s.id);
  });

  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem("slotContent");
    return (
        JSON.parse(saved) || defaultSlots.reduce((acc, s) => {
          acc[s.id] = `Content for ${s.title}`;
          return acc;
        }, {})
    );
  });

  const [hidden, setHidden] = useState(() => {
    const saved = localStorage.getItem("slotHidden");
    return saved ? JSON.parse(saved) : [];
  });

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem("slotOrder", JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    localStorage.setItem("slotContent", JSON.stringify(content));
  }, [content]);

  useEffect(() => {
    localStorage.setItem("slotHidden", JSON.stringify(hidden));
  }, [hidden]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id);
      const newIndex = order.indexOf(over.id);
      setOrder(arrayMove(order, oldIndex, newIndex));
    }
  };

  const updateContent = (id, val) => setContent((prev) => ({ ...prev, [id]: val }));
  const toggleHide = (id) => setHidden((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const startEdit = (id) => setEditing(id);
  const cancelEdit = () => setEditing(null);

  return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map((id) => {
            if (hidden.includes(id)) return null;
            const slot = defaultSlots.find((s) => s.id === id);
            return (
                <SortableItem
                    key={id}
                    id={id}
                    draggable={slot.draggable}
                    onEdit={startEdit}
                    onHide={toggleHide}
                    isEditing={editing === id}
                >
                  <EditableSlot
                      title={slot.title}
                      content={content[id]}
                      onChange={(val) => updateContent(id, val)}
                      isEditing={editing === id}
                      onCancel={cancelEdit}
                  />
                </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
  );
}
