'use client';

import styled from '@emotion/styled';
import {
  MotionProps,
  TapInfo,
  Variants,
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const Wrapper = styled(motion.div)<{ width: number; height: number }>`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  color: #333333;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.25);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

interface CartridgeProps extends MotionProps {
  parentWidth: number;
  parentHeight: number;
  id: number;
  setDragged: (id: number) => void;
}

const width = 220;
const height = 252;

const offsetX = 0;
const offsetY = 96;

const variants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
};

export default function Cartridge({
  dragConstraints,
  parentWidth,
  parentHeight,
  id,
  setDragged,
}: CartridgeProps) {
  const [loaded, setLoaded] = useState(false);

  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.5);

  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const rotate = useSpring(0, { stiffness: 1000, damping: 100 });

  // Randomize position on mount
  useEffect(() => {
    if (parentWidth && parentHeight) {
      x.set(Math.random() * (parentWidth * 0.65 - width) + parentWidth * 0.1);
      y.set(Math.random() * (parentHeight * 1 - height) + parentHeight * 0);
      rotate.set(Math.random() * 360, false);
    }
  }, [parentHeight, parentWidth, rotate, x, y]);

  const handleTapStart = (_: MouseEvent, { point }: TapInfo) => {
    const pointX = point.x - offsetX;
    const pointY = point.y - offsetY;

    const vectorA = {
      x: pointX - x.get() - originX.get() * width,
      y: pointY - y.get() - originY.get() * height,
    };

    const vectorB = {
      x:
        vectorA.x * Math.cos(-rotate.get() * (Math.PI / 180)) -
        vectorA.y * Math.sin(-rotate.get() * (Math.PI / 180)),
      y:
        vectorA.x * Math.sin(-rotate.get() * (Math.PI / 180)) +
        vectorA.y * Math.cos(-rotate.get() * (Math.PI / 180)),
    };

    const vectorC = {
      x: vectorA.x - vectorB.x,
      y: vectorA.y - vectorB.y,
    };

    x.set(x.get() + vectorC.x);
    y.set(y.get() + vectorC.y);

    originX.set((pointX - x.get()) / width);
    originY.set((pointY - y.get()) / height);
  };

  const handleDrag = (
    { movementX, movementY }: MouseEvent,
    { point }: TapInfo
  ) => {
    const vectorA = {
      x: (0.5 - originX.get()) * width,
      y: (0.5 - originY.get()) * height,
    };

    const mass = 0.5;
    const velocity = Math.sqrt(movementX ** 2 + movementY ** 2) * mass;
    const force =
      ((0.5 - originX.get()) ** 2 + (0.5 - originY.get()) ** 2) * velocity;

    // console.log(force);

    const vectorB = {
      x:
        vectorA.x * Math.cos(rotate.get() * (Math.PI / 180)) -
        vectorA.y * Math.sin(rotate.get() * (Math.PI / 180)),
      y:
        vectorA.x * Math.sin(rotate.get() * (Math.PI / 180)) +
        vectorA.y * Math.cos(rotate.get() * (Math.PI / 180)),
    };

    const vectorC = {
      x: vectorB.x - movementX,
      y: vectorB.y - movementY,
    };

    let angle =
      (Math.atan2(vectorC.y, vectorC.x) - Math.atan2(vectorB.y, vectorB.x)) *
      (180 / Math.PI) *
      force;

    // Fix delta angle to be between -180 and 180
    if (angle > 180 * force) {
      angle -= 360 * force;
    } else if (angle < -180 * force) {
      angle += 360 * force;
    }

    // if point is on right side of screen
    if (point.x > window.innerWidth * 0.75) {
      const laps = Math.round((rotate.get() + 90) / 360);
      rotate.set(-90 + 360 * laps);
    } else {
      rotate.set(rotate.get() + angle);
    }
  };

  return (
    <Wrapper
      variants={variants}
      width={width}
      height={height}
      drag
      dragConstraints={dragConstraints}
      onDrag={handleDrag}
      onDragStart={() => setDragged(id)}
      onDragEnd={() => setDragged(-1)}
      style={{ originX, originY, x, y, rotate }}
      onTapStart={handleTapStart}
      initial="hidden"
      animate={loaded ? 'visible' : 'hidden'}
      exit="hidden"
      layoutId={`cartridge-${id}`}
    >
      <Image
        src={`/images/cartridges/${id}.png`}
        width={270}
        height={270}
        alt="cartridge"
        draggable={false}
        onLoadingComplete={() => setLoaded(true)}
      />
    </Wrapper>
  );
}
