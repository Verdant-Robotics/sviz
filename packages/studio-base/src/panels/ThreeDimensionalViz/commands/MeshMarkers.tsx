// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.
import { ReactElement, useMemo } from "react";

import { CommonCommandProps, GLTFScene, parseGLB } from "@foxglove/regl-worldview";
import { rewritePackageUrl } from "@foxglove/studio-base/context/AssetsContext";
import { MeshMarker } from "@foxglove/studio-base/types/Messages";

type MeshMarkerProps = CommonCommandProps & {
  markers: MeshMarker[];
  basePath?: string;
};

async function loadModel(url: string): Promise<unknown> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const model = await parseGLB(buffer);
  return model;
}

class ModelCache {
  private models = new Map<string, Promise<unknown>>();

  async load(url: string): Promise<unknown> {
    let promise = this.models.get(url);
    if (promise) {
      return await promise;
    }
    promise = loadModel(url);
    this.models.set(url, promise);
    return await promise;
  }
}

function MeshMarkers({ markers, layerIndex, basePath }: MeshMarkerProps): ReactElement {
  const models: React.ReactNode[] = [];

  const modelCache = useMemo(() => new ModelCache(), []);

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]!;
    const { pose, mesh_resource, scale } = marker;
    if (mesh_resource == undefined || mesh_resource.length === 0) {
      continue;
    }
    const url = rewritePackageUrl(mesh_resource, basePath);

    models.push(
      <GLTFScene key={i} layerIndex={layerIndex} model={async () => await modelCache.load(url)}>
        {{ pose, scale, interactionData: undefined }}
      </GLTFScene>,
    );
  }

  return <>{...models}</>;
}

export default MeshMarkers;
