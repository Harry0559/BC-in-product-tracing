import React from "react";

export function TraceProduct({ traceProduct }) {
  return (
    <div>
        <form
            onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const addr = formData.get("provider");
            const id = formData.get("id");

            if (addr && id) {
                traceProduct(addr,id);
            }
            }}
        >
            <div className="form-group">
            <label>Account address</label>
            <input className="form-control" type="text" name="provider" required />
            </div>
            <div className="form-group">
            <label>Product ID</label>
            <input className="form-control" type="number" step="1" min="1" name="id" required />
            </div>
            <div className="form-group">
            <input className="btn btn-primary" type="submit" value="Search" />
            </div>
        </form>
    </div>
  );
}