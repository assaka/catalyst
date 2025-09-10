/**
 * SlotWrapper - Simplified universal wrapper that renders slots
 * Store owners never touch this file
 */

import React from 'react';
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragOverlay
} from '@dnd-kit/core';

import {
    arrayMove,
    SortableContext,
    useSortable,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';


// Sortable slot wrapper using dnd-kit
const SortableSlot = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};


// === Main SlotWrapper ===

const SlotWrapper = ({
                         slotDefinitions = {},
                         slotOrder = [],
                         layoutConfig = {},
                         data = {},
                         className = "",
                         children,
                         enableDnD = false,
                         onMoveSlot = () => {},
                         ...props
                     }) => {
    const {
        itemLayout = {},
    } = layoutConfig;

    const {
        layout = 'flex',
        direction = 'column',
        gap = 4 // Tailwind scale (gap-4 = 1rem)
    } = itemLayout;

    const [activeId, setActiveId] = React.useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        if (event?.active?.id) {
            setActiveId(event.active.id);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active?.id && over?.id && active.id !== over.id) {
            const oldIndex = slotOrder.indexOf(active.id);
            const newIndex = slotOrder.indexOf(over.id);
            const newOrder = arrayMove(slotOrder, oldIndex, newIndex);

            // Inform parent
            onMoveSlot?.(newOrder);
        }
    };

    const renderSlot = (slotId) => {
        const slotDef = slotDefinitions[slotId];
        if (!slotDef) {
            console.warn(`Slot definition not found: ${slotId}`);
            return null;
        }

        const Component = slotDef.component;
        if (!Component) {
            console.warn(`Component not found for slot: ${slotId}`);
            return null;
        }

        return (
            <Component
                key={slotId}
                {...slotDef.props}
                {...props}
                data={data}
                layoutConfig={layoutConfig}
            >
                {slotDef.children}
            </Component>
        );
    };

    const layoutStyles = {
        display: layout,
        flexDirection: layout === 'flex' ? direction : undefined,
        gap: `${gap * 4}px`
    };

    const content = enableDnD ? (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={slotOrder} strategy={verticalListSortingStrategy}>
                {slotOrder.map((slotId) => (
                    <SortableSlot key={slotId} id={slotId}>
                        {renderSlot(slotId)}
                    </SortableSlot>
                ))}
            </SortableContext>

            <DragOverlay>
                {activeId ? renderSlot(activeId) : null}
            </DragOverlay>
        </DndContext>
    ) : (
        slotOrder.map((slotId) => renderSlot(slotId))
    );

    return (
        <div className={`slot-wrapper ${className}`} style={layoutStyles}>
            {content}
            {children}
        </div>
    );
};

export default SlotWrapper;
