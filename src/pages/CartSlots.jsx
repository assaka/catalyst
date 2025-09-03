/**
 * CartSlots.jsx - SINGLE FILE FOR STORE OWNERS
 * 
 * This is the ONLY file you need to edit to customize your cart page.
 * Everything is in one place: components, layouts, and slot definitions.
 * 
 * 🎯 DRAG & DROP: Change the order in "slotOrder" arrays
 * 🎨 LAYOUTS: Choose layouts for each section  
 * 📱 RESPONSIVE: Different layouts for mobile/desktop
 * ✨ MICRO-SLOTS: Rearrange elements within cart items
 * 🧩 COMPONENTS: Modify components directly in this file
 */

import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, EyeOff, GripVertical } from "lucide-react";

// Basic SlotWrapper to add cancel button while editing
const SlotWrapper = ({ children, isEditing, onEditCancel }) => (
    <div className="relative p-4 border rounded bg-white shadow-sm">
      {children}
      {isEditing && (
          <div className="mt-2 text-right">
            <button
                onClick={onEditCancel}
                className="px-3 py-1 bg-red-200 rounded hover:bg-red-300 text-sm"
            >
              Cancel Edit
            </button>
          </div>
      )}
    </div>
);

// Example Slot Components (simplified)
const HeaderSlot = ({ content, onChange, isEditing, onCancelEdit }) => (
    <SlotWrapper isEditing={isEditing} onEditCancel={onCancelEdit}>
      <h2 className="text-xl font-bold mb-2">Header</h2>
      {isEditing ? (
          <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
          />
      ) : (
          <p>{content}</p>
      )}
    </SlotWrapper>
);

const CartItemsSlot = ({ content, onChange, isEditing, onCancelEdit }) => (
    <SlotWrapper isEditing={isEditing} onEditCancel={onCancelEdit}>
      <h2 className="text-xl font-bold mb-2">Cart Items</h2>
      {isEditing ? (
          <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
          />
      ) : (
          <p>{content}</p>
      )}
    </SlotWrapper>
);

const CouponSlot = ({ content, onChange, isEditing, onCancelEdit }) => (
    <SlotWrapper isEditing={isEditing} onEditCancel={onCancelEdit}>
      <h2 className="text-xl font-bold mb-2">Coupon</h2>
      {isEditing ? (
          <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={2}
          />
      ) : (
          <p>{content}</p>
      )}
    </SlotWrapper>
);

const OrderSummarySlot = ({ content, onChange, isEditing, onCancelEdit }) => (
    <SlotWrapper isEditing={isEditing} onEditCancel={onCancelEdit}>
      <h2 className="text-xl font-bold mb-2">Order Summary</h2>
      {isEditing ? (
          <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
          />
      ) : (
          <p>{content}</p>
      )}
    </SlotWrapper>
);

const RecommendedProductsSlot = ({ content, onChange, isEditing, onCancelEdit }) => (
    <SlotWrapper isEditing={isEditing} onEditCancel={onCancelEdit}>
      <h2 className="text-xl font-bold mb-2">Recommended Products</h2>
      {isEditing ? (
          <textarea
              className="w-full p-2 border rounded"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
          />
      ) : (
          <p>{content}</p>
      )}
    </SlotWrapper>
);

// Sortable item with drag handle, hover toolbar (edit, hide)
function SortableItem({ id, children, disabled = false, onEditClick, onHideClick, isEditing }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    padding: "1rem",
    marginBottom: "1rem",
    border: "1px dashed #ccc",
    borderRadius: "6px",
    backgroundColor: "#fff",
  };

  // If not draggable, skip drag handle and disable drag-related attributes
  if (disabled) {
    return (
        <div
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
          {children}
          {isHovered && (
              <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 8,
                  }}
              >
                <button
                    onClick={() => onEditClick(id)}
                    title="Edit"
                    className="hover:text-blue-600 focus:outline-none"
                >
                  <Pencil size={16} />
                </button>
                <button
                    onClick={() => onHideClick(id)}
                    title="Hide"
                    className="hover:text-red-600 focus:outline-none"
                >
                  <EyeOff size={16} />
                </button>
              </div>
          )}
        </div>
    );
  }

  return (
      <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag handle */}
        {isHovered && (
            <div
                {...listeners}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  cursor: "grab",
                  color: isDragging ? "#aaa" : "#666",
                }}
                title="Drag"
            >
              <GripVertical size={20} />
            </div>
        )}

        {children}

        {/* Toolbar */}
        {isHovered && (
            <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  gap: 8,
                }}
            >
              <button
                  onClick={() => onEditClick(id)}
                  title="Edit"
                  className="hover:text-blue-600 focus:outline-none"
              >
                <Pencil size={16} />
              </button>
              <button
                  onClick={() => onHideClick(id)}
                  title="Hide"
                  className="hover:text-red-600 focus:outline-none"
              >
                <EyeOff size={16} />
              </button>
            </div>
        )}
      </div>
  );
}

const defaultSlots = [
  { id: "header", component: HeaderSlot, editable: true, draggable: false },
  { id: "cartItems", component: CartItemsSlot, editable: true, draggable: true },
  { id: "coupon", component: CouponSlot, editable: true, draggable: true },
  { id: "orderSummary", component: OrderSummarySlot, editable: true, draggable: true },
  { id: "recommendedProducts", component: RecommendedProductsSlot, editable: true, draggable: true },
];

export default function CartSlots() {
  // Load saved order from localStorage or default
  const [slotOrder, setSlotOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("cartSlotsOrder");
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSlots.map((s) => s.id);
  });

  // Load saved slot content or default text
  const [slotContents, setSlotContents] = useState(() => {
    try {
      const saved = localStorage.getItem("cartSlotsContent");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      header: "Welcome to your cart!",
      cartItems: "Here are your items...",
      coupon: "Apply coupons here",
      orderSummary: "Summary of your order",
      recommendedProducts: "Recommended products for you",
    };
  });

  // Slots hidden by user
  const [hiddenSlots, setHiddenSlots] = useState(() => {
    try {
      const saved = localStorage.getItem("cartSlotsHidden");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Currently editing slot ID (only one at a time)
  const [editingSlot, setEditingSlot] = useState(null);

  // Persist slot order on change
  useEffect(() => {
    localStorage.setItem("cartSlotsOrder", JSON.stringify(slotOrder));
  }, [slotOrder]);

  // Persist slot content on change
  useEffect(() => {
    localStorage.setItem("cartSlotsContent", JSON.stringify(slotContents));
  }, [slotContents]);

  // Persist hidden slots on change
  useEffect(() => {
    localStorage.setItem("cartSlotsHidden", JSON.stringify(hiddenSlots));
  }, [hiddenSlots]);

  // Setup drag sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Handle drag end - reorder slotOrder
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slotOrder.indexOf(active.id);
      const newIndex = slotOrder.indexOf(over.id);
      const newOrder = arrayMove(slotOrder, oldIndex, newIndex);
      setSlotOrder(newOrder);
    }
  };

  // Update slot content handler
  const updateSlotContent = (id, content) => {
    setSlotContents((prev) => ({ ...prev, [id]: content }));
  };

  // Get slot object by id
  const getSlotById = (id) => defaultSlots.find((s) => s.id === id);

  // Toggle hiding a slot
  const toggleHideSlot = (id) => {
    setHiddenSlots((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // If editing this slot, cancel edit on hide
    if (editingSlot === id) setEditingSlot(null);
  };

  // Start editing a slot
  const startEditing = (id) => {
    setEditingSlot(id);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSlot(null);
  };

  return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slotOrder} strategy={verticalListSortingStrategy}>
          {slotOrder.map((slotId) => {
            if (hiddenSlots.includes(slotId)) return null; // skip hidden slots

            const slot = getSlotById(slotId);
            if (!slot) return null;

            const SlotComponent = slot.component;

            return (
                <SortableItem
                    key={slot.id}
                    id={slot.id}
                    disabled={!slot.draggable}
                    onEditClick={startEditing}
                    onHideClick={toggleHideSlot}
                    isEditing={editingSlot === slot.id}
                >
                  <SlotComponent
                      content={slotContents[slot.id]}
                      onChange={slot.editable ? (content) => updateSlotContent(slot.id, content) : undefined}
                      isEditing={editingSlot === slot.id}
                      onCancelEdit={cancelEditing}
                  />
                </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
  );
}
