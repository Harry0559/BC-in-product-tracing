import React from "react";

export function ErrorMessage({ message, dismiss }) {
  if (typeof message === "object") {
    if (message.message) {
      message = message.message;
    }
    else if (message.error) {
      message = message.error.message;
    }
  }
  return (
    <div className="alert alert-danger" role="alert">
      {message}
      <button
        type="button"
        className="close"
        data-dismiss="alert"
        aria-label="Close"
        onClick={dismiss}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}