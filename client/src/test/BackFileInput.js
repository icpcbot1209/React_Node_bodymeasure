import React, { useState } from "react";

const bufPreviewInit = (isMale) => {
  if (isMale) return "./images/front-male.svg";
  if (!isMale) return "./images/front-female.svg";
};

const BackFileInput = ({ isMale }) => {
  const [bufPreview, setBufPreview] = useState(bufPreviewInit(isMale));

  const doImagePreview = (_file) => {
    let reader = new FileReader();
    reader.onloadend = (e) => {
      setBufPreview(e.target.result);
    };
    reader.readAsDataURL(_file);
  };

  const doChangeImage = (files) => {
    if (files.length > 0) {
      doImagePreview(files[0]);
    }
  };

  const onChangeImage = (e) => {
    let files = e.target.files;
    doChangeImage(files);
  };

  const onDropImage = (e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    let files = e.dataTransfer.files;
    doChangeImage(files);
    return false;
  };

  const tagback = ("file_input" + (isMale ? "1" : "0"), +"3");

  return (
    <div className="col-sm-6 front_photo upload-iamges">
      <label
        htmlFor={tagback}
        onDragOver={(e) => {
          e.preventDefault();
          return false;
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          return false;
        }}
        onDrop={onDropImage}
      >
        <div className="body-model__form-file-preview">
          <div className="body-model__form-file-preview">
            <img
              className="body-model__form-file-preview-real"
              src={bufPreview}
              alt={isMale ? "Male" : "Female"}
            />
          </div>
          {/* <img
            className="body-model__form-file-preview-real"
            src="images/front-dummy.jpg"
            alt=""
            style={{ display: "none" }}
          /> */}
        </div>
        <div className="body-model__form-file-overflow">
          <p className="body-model__form-file-pos">Back photo</p>
          <p className="body-model__form-file-text">
            Drop files to upload
            <br /> or click here
          </p>
          <i
            className="body-model__form-file-icon fa fa-camera"
            aria-hidden="true"
            style={{ display: "none" }}
          ></i>
        </div>
      </label>
      <input
        type="file"
        id={tagback}
        style={{ display: "none" }}
        className="form-control-file"
        onChange={onChangeImage}
      />
    </div>
  );
};

export default BackFileInput;
