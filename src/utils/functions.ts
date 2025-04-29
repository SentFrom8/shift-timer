interface Point {
  x: number;
  y: number;
}

interface LineSegment {
  start: Point;
  end: Point;
}

export const formatTime = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const getAngleFromPoints = (p1: Point, p2: Point, p3: Point) => {
  const l12 = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  const l13 = Math.sqrt((p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2);
  const l23 = Math.sqrt((p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2);

  return Math.acos((l12 ** 2 + l13 ** 2 - l23 ** 2) / (2 * l12 * l13));
};

export const getArcSegmentLine = (
  startPercent: number,
  segmentSpanPercent: number,
  radius: number,
  center: Point,
  arcGapAngle: number
): LineSegment => {
  const arcStartAngle = (3 * Math.PI) / 2 - arcGapAngle / 2;
  const arcEndAngle = (3 * Math.PI) / 2 + arcGapAngle / 2 - 2 * Math.PI;

  const targetStartAngle =
    arcStartAngle + (arcEndAngle - arcStartAngle) * startPercent;
  const targetEndAngle =
    arcStartAngle +
    (arcEndAngle - arcStartAngle) * (startPercent + segmentSpanPercent);

  const segmentStart: Point = {
    x: center.x + radius * Math.cos(targetStartAngle),
    y: center.y - radius * Math.sin(targetStartAngle),
  };
  const segmentEnd: Point = {
    x: center.x + radius * Math.cos(targetEndAngle),
    y: center.y - radius * Math.sin(targetEndAngle),
  };
  return { start: segmentStart, end: segmentEnd };
};

export const arcSvgConfig = (() => {
  const viewBoxBoundry: LineSegment = {
    start: { x: 0, y: 0 },
    end: { x: 200, y: 200 },
  };
  const radius = 90;
  const strokeWidth = 15;
  const xOffset = 30;
  const yOffset = 30;

  const arcStart: Point = { x: xOffset, y: viewBoxBoundry.end.y - yOffset };
  const arcEnd: Point = {
    x: viewBoxBoundry.end.x - xOffset,
    y: viewBoxBoundry.end.y - yOffset,
  };

  const arcCenter: Point = {
    x: viewBoxBoundry.end.x / 2,
    y: arcStart.y - Math.sqrt(radius ** 2 - ((arcEnd.x - arcStart.x) / 2) ** 2),
  };

  const gapAngle = getAngleFromPoints(arcCenter, arcStart, arcEnd);

  const flipPercentage = 0.5 / (1 - gapAngle / (2 * Math.PI));

  return {
    viewBoxBoundry,
    radius,
    strokeWidth,
    xOffset,
    yOffset,
    arcStart,
    arcEnd,
    arcCenter,
    gapAngle,
    flipPercentage,
  };
})();
