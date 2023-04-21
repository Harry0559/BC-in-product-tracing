import React from "react";

export function Authorize({ authorizeAddress }) {
  return (
    <div>
        <form
            onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const add = formData.get("add");

            if (add) {
                authorizeAddress(add);
            }
            }}
        >
            <div className="form-group">
            <label>Account address</label>
            <input className="form-control" type="text" name="add" required />
            </div>
            <div className="form-group">
            <input className="btn btn-primary" type="submit" value="Authorize" />
            </div>
        </form>
    </div>
  );
}
