/** 차트의 표 보기. 색이나 그림 없이도 같은 값을 읽을 수 있게 한다. */
export function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center text-muted">표로 보기</summary>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="border-b border-line px-2 py-1.5 font-medium text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="border-b border-line px-2 py-1.5 text-left font-normal">
                      {c}
                    </th>
                  ) : (
                    <td key={j} className="border-b border-line px-2 py-1.5">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
