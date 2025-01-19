import { FC } from 'react';

export interface DebugInfoProps {
  totalRows: number;
  renderedRows: number;
  startRow: number;
  startCol: number;
  endCol: number;
  endRow: number;
  totalColumns: number;
  renderedColumns: number;
  totalCells: number;
  renderedCells: number;
  bufferSize: {
    rows: number;
    columns: number;
  };
}

export const DebugPanel: FC<DebugInfoProps> = (props) => {
  return (
    <section className="fixed bottom-10 right-10 bg-black/80 text-white p-4 rounded-lg z-50 font-mono text-sm">
      <h3 className="font-bold mb-2">Virtualization Debug</h3>
      <p>Total Rows: {props.totalRows}</p>
      <p>Rendered Rows: {props.renderedRows}</p>
      <p>
        Visible Rows: {props.startRow} - {props.endRow}
      </p>
      <p>Total Columns: {props.totalColumns}</p>
      <p>Rendered Columns: {props.renderedColumns}</p>
      <p>
        Visible Cols: {props.startCol} - {props.endCol}
      </p>
      <p>Total Cells: {props.totalCells}</p>
      <p>Rendered Cells: {props.renderedCells}</p>
      <br />
      <p>Buffer Size Cols: {props.bufferSize.columns}</p>
      <p>Buffer Size Rows: {props.bufferSize.rows}</p>
      <p>
        Memory Saved:{' '}
        {(
          (1 -
            (props.renderedRows * props.renderedColumns) /
              (props.totalRows * props.totalColumns)) *
          100
        ).toFixed(2)}
        %
      </p>
    </section>
  );
};
