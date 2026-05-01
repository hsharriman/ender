import React from "react";
import { createPortal } from "react-dom";

export interface ReasonPickerPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  names: string[];
  onPick: (name: string) => void;
}

type Pos = { top: number; left: number; width: number };

/**
 * Floating list of reason names, portaled to `document.body` and anchored to an input.
 */
export class ReasonPickerPopover extends React.Component<
  ReasonPickerPopoverProps,
  Pos
> {
  state: Pos = { top: 0, left: 0, width: 200 };

  private syncPosition = () => {
    if (!this.props.open) return;
    const el = this.props.anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = r.bottom + 4;
    const left = r.left;
    const width = Math.max(r.width, 220);
    if (
      Math.abs(this.state.top - top) < 0.5 &&
      Math.abs(this.state.left - left) < 0.5 &&
      Math.abs(this.state.width - width) < 0.5
    ) {
      return;
    }
    this.setState({ top, left, width });
  };

  componentDidMount() {
    this.syncPosition();
    window.addEventListener("scroll", this.syncPosition, true);
    window.addEventListener("resize", this.syncPosition);
  }

  componentDidUpdate(prevProps: ReasonPickerPopoverProps) {
    if (
      prevProps.open !== this.props.open ||
      prevProps.names !== this.props.names ||
      prevProps.anchorRef !== this.props.anchorRef
    ) {
      this.syncPosition();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.syncPosition, true);
    window.removeEventListener("resize", this.syncPosition);
  }

  render() {
    const { open, names, onPick } = this.props;
    if (!open || names.length === 0) {
      return null;
    }
    return createPortal(
      <div
        className="fixed z-[200] max-h-48 overflow-y-auto rounded border border-slate-200 bg-white text-xs shadow-lg"
        style={{
          top: this.state.top,
          left: this.state.left,
          width: this.state.width,
        }}
        role="listbox"
        aria-label="Choose reason"
      >
        {names.slice(0, 80).map((name) => (
          <button
            key={name}
            type="button"
            role="option"
            className="block w-full px-2 py-1 text-left hover:bg-slate-100"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>,
      document.body,
    );
  }
}
