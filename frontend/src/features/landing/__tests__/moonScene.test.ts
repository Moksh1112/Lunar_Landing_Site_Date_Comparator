import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { chapterBlend, disposeScene, toXYZ } from "../moonScene";

describe("illustration coordinates", () => {
  it("keeps east-positive lunar longitudes on the declared sphere axes", () => {
    const east = toXYZ(0, 90);
    expect(east.x).toBeCloseTo(0);
    expect(east.y).toBeCloseTo(0);
    expect(east.z).toBeCloseTo(-1);
    expect(toXYZ(0, -90).z).toBeCloseTo(1);
  });
  it("places the south pole on the negative north axis and respects scale", () => {
    const pole = toXYZ(-90, 0, 2);
    expect(pole.y).toBeCloseTo(-2);
    expect(pole.length()).toBeCloseTo(2);
  });
  it("clamps chapter endpoints to valid camera shots", () => {
    expect(chapterBlend(-1, 5)).toEqual({ i: 0, t: 0 });
    expect(chapterBlend(2, 5)).toEqual({ i: 3, t: 1 });
  });
  it("releases colour, height and cloud textures without disposing shared textures twice", () => {
    const scene = new THREE.Scene();
    const surface = new THREE.Texture(), height = new THREE.Texture(), clouds = new THREE.Texture();
    const spies = [surface, height, clouds].map(t => vi.spyOn(t, "dispose"));
    const geometry = new THREE.SphereGeometry();
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const material = new THREE.MeshStandardMaterial({ map: surface, bumpMap: height, alphaMap: clouds });
    scene.add(new THREE.Mesh(geometry, material));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial({ map: surface })));
    disposeScene(scene);
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    expect(disposeGeometry).toHaveBeenCalledOnce();
  });
});
