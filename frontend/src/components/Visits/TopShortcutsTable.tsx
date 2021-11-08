import { Table } from "react-bulma-components";
import { Shortcut } from "../Shortcuts/ShortcutsPage";
import React from "react";

export const TopShortcutsTable = (props: any) => {
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
            // TODO: add key
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
