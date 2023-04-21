import React, { useState } from 'react';

export function AddProduct({ addProduct }) {
    const [inputCount, setInputCount] = useState(0);

    const handleSelectChange = (e) => {
        setInputCount(parseInt(e.target.value));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get("id");
        const name = formData.get("name");
        const time = formData.get("time");
        const location = formData.get("location");
        const providers = [];
        const ids = [];
        const signatures = [];
        for (let i = 0; i < inputCount; i++) {
            providers.push(formData.get("provider"+i));
            ids.push(formData.get("id"+i));
            signatures.push(formData.get("signature"+i));
        }
        if(id && name && time && location) {
            addProduct(id,name,time,location,providers,ids,signatures);
        }
    };

    const inputBoxes_providers = [];
    const inputBoxes_ids = [];
    const inputBoxes_signatures = [];
    for (let i = 0; i < inputCount; i++) {
        inputBoxes_providers.push(
        <li key={i}>
        <input className="form-control" type="text" name={'provider' + i} required />
        </li>
        );
    }
    for (let i = 0; i < inputCount; i++) {
        inputBoxes_ids.push(
        <li key={i + inputCount}>
        <input className="form-control" type="number" step="1" min="1" name={'id' + i} required />
        </li>
        );
    }
    for (let i = 0; i < inputCount; i++) {
        inputBoxes_signatures.push(
        <li key={i + 2*inputCount}>
        <input className="form-control" type="text" name={'signature' + i} required />
        </li>
        );
    }

    return (
        <form onSubmit={handleFormSubmit}>
            <div className="form-group">
            <label>Select the number of sources</label>
            <select className="form-control" onChange={handleSelectChange}>
            <option value="">please select</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            </select>
            </div>

            <div className="form-group">
            <label>Product ID</label>
            <input className="form-control" type="number" step="1" min="1" name="id" required />
            </div>
            <div className="form-group">
            <label>Product name</label>
            <input className="form-control" type="text" name="name" required />
            </div>
            <div className="form-group">
            <label>Manufacturing date</label>
            <input className="form-control" type="text" name="time" required />
            </div>
            <div className="form-group">
            <label>Manufacturing location</label>
            <input className="form-control" type="text" name="location" required />
            </div>
            {inputCount > 0 && (
            <div className="form-group">
                <div className="form-group">
                <label>Supplier's account address</label>
                <ol>
                {inputBoxes_providers}
                </ol>
                </div>
                <div className="form-group">
                <label>Supplier's product ID</label>
                <ol>
                {inputBoxes_ids}
                </ol>
                </div>
                <div className="form-group">
                <label>Supplier's signature</label>
                <ol>
                {inputBoxes_signatures}
                </ol>
                </div>
            </div>
            )}
            <div className="form-group">
            <input className="btn btn-primary" type="submit" value="Submit" />
            </div>
        </form>
    );
}
