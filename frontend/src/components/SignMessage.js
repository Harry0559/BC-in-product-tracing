import React from "react";

export function SignMessage({ sign }) {
  return (
    <div>
        <form
            onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const id = formData.get("id");
            const addr = formData.get("addr");

            if (id && addr) {
                sign(id,addr);
            }
            }}
        >
            <div className="form-group">
            <label>Your product ID</label>
            <input className="form-control" type="number" step="1" min="1" name="id" required />
            </div>
            <div className="form-group">
            <label>Account address of the counterparty</label>
            <input className="form-control" type="text" name="addr" required />
            </div>
            <div className="form-group">
            <input className="btn btn-primary" type="submit" value="Sign" />
            </div>
        </form>
    </div>
  );
}