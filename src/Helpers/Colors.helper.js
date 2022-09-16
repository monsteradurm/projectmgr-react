import _ from "underscore";
import { Colors } from "./ColorData"
const names = _.pluck(Colors, 'name');
const ignores = ['white', 'shell', 'cream', 'light']

const FilteredColors = names.filter(c => 
    ignores.filter(i => c.toLowerCase().indexOf(i) >= 0).length < 1
)

export const RandomRGB = () => {
    const index = Math.round(Math.random() * (FilteredColors.length -1));
    return FilteredColors[index];
}

export const SelectColor = (colorNum, colors) => {
    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
    return "hsl(" + (colorNum * (360 / colors) % 360) + ",50%,50%)";
}