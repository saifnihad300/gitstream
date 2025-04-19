import { repositories } from "src/_mock/repositories";
import FeedCards from "./product-card";


export default {
    title: 'gitstream/client/components/FeedCards',
    component: FeedCards,
    parameters: {
        layout: 'centered',
    },
}

export const Default = {
    args: {
        items: repositories
    },
}
