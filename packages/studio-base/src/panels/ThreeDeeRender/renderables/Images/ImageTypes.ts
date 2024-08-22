// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Time } from "@foxglove/rostime";
import { CompressedImage, ImageAnnotations, RawImage } from "@foxglove/schemas";
import { CAMERA_CALIBRATION_DATATYPES } from "@foxglove/studio-base/panels/ThreeDeeRender/foxglove";

import {
  Image as RosImage,
  CompressedImage as RosCompressedImage,
  CAMERA_INFO_DATATYPES,
} from "../../ros";

export const ALL_CAMERA_INFO_SCHEMAS = new Set([
  ...CAMERA_INFO_DATATYPES,
  ...CAMERA_CALIBRATION_DATATYPES,
]);

/** A compressed image with annotations */
export type CompressedAnnotatedImage = {
  image: CompressedImage;
  annotations: ImageAnnotations;
};

export type CompressedImageTypes = RosCompressedImage | CompressedImage | CompressedAnnotatedImage;

export type AnyImage =
  | RosImage
  | RosCompressedImage
  | RawImage
  | CompressedImage
  | CompressedAnnotatedImage;

export function getFrameIdFromImage(image: AnyImage): string {
  if ("image" in image) {
    return getFrameIdFromImage(image.image);
  } else if ("header" in image) {
    return image.header.frame_id;
  } else {
    return image.frame_id;
  }
}

export function getTimestampFromImage(image: AnyImage): Time {
  if ("image" in image) {
    return getTimestampFromImage(image.image);
  } else if ("header" in image) {
    return image.header.stamp;
  } else {
    return image.timestamp;
  }
}
