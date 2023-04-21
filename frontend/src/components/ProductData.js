import React from "react";

export function ProductData({ history,index,dismiss,jump,back,forward }) {
  const productData = history[index];
  const name = productData.name;
  const time = productData.time;
  const location = productData.location;
  const sources = productData.sources;
  const buttons = sources.map((obj) => {
    const provider = obj.provider;
    const id = parseInt(obj.id._hex);
    return (
      <li key={provider}>
        <button onClick={() => jump(provider,id)}>
        Account address: {provider}
        <br/>
        Product ID: {id}
        </button>
      </li>
    );
  });
  return (
    <div className="alert alert-info" role="alert">
      <ul>
        <li>Product name: {name}</li>
        <li>Manufacturing date: {time}</li>
        <li>Manufacturing location: {location}</li>
        <li>Raw materials:</li>
      </ul>
      {sources.length === 0 && (<p>No raw materials</p>)}
      {sources.length > 0 && (<ol>{buttons}</ol>)}
      {index > 0 && (<button onClick={back}>Back</button>)}
      {index < history.length-1 && (<button onClick={forward}>Forward</button>)}
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