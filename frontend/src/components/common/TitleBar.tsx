import { Button, Form, Heading, Level } from "react-bulma-components";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface TitleBarProps {
  title: string;
  onSearchSubmit?: (value: string) => void;
}

export const TitleBar = (props: TitleBarProps) => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <Level>
      <Level.Side>
        <Level.Item>
          <Heading size={5}>{props.title}</Heading>
        </Level.Item>
      </Level.Side>

      {props.onSearchSubmit && (
        <Level.Side align="right">
          <Level.Item>
            <Form.Field kind="addons">
              <Form.Control>
                <Form.Input
                  placeholder="Find a shortcut"
                  type={"search"}
                  value={searchValue}
                  onChange={(evt) => setSearchValue(evt.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter")
                      if (props.onSearchSubmit)
                        props.onSearchSubmit(searchValue);
                  }}
                />
              </Form.Control>
              <Form.Control>
                <Button
                  onClick={() => {
                    if (props.onSearchSubmit) props.onSearchSubmit(searchValue);
                  }}
                >
                  <FontAwesomeIcon icon={faSearch} style={{ marginRight: 5 }} />
                  Search
                </Button>
              </Form.Control>
            </Form.Field>
          </Level.Item>
        </Level.Side>
      )}
    </Level>
  );
};
