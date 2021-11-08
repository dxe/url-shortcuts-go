import { Table } from "react-bulma-components";
import { Shortcut } from "../Shortcuts/ShortcutsPage";
import React from "react";

interface TopShortcutsTableProps {
  shortcuts: Shortcut[]
}

export const TopShortcutsTable = (props: TopShortcutsTableProps) => {
  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Visits</th>
          </tr>
        </thead>
        <tbody>
          {props.shortcuts?.map((s: Shortcut) => (
            <tr>
              <td>{s.Code}</td>
              <td>{s.TotalVisits}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};
