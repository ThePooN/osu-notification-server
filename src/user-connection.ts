import UserConnectionConfig from "./types/user-connection-config";

export default class UserConnection {
    private config: UserConnectionConfig;
    private userId: number;

    constructor(userId: number, config: UserConnectionConfig) {
        this.config = config;
        this.userId = userId;
    }

    public boot = () => {
        this.subscribe();
        this.config.ws.on("close", this.close);
    }

    public close = () => {
        this.config.redisSubscriber.unsubscribeAll(this);
    }

    public event = (channel: string, message: string) => {
        "x";
    }

    public subscribe = async () => {
        const subscriptions = await this.subscriptions();
        this.config.redisSubscriber.subscribe(subscriptions, this);
    }

    public subscriptions = async () => {
        const ret = [];

        const forumTopic = this.forumTopicSubscriptions();
        const beatmapset = this.beatmapsetSubscriptions();

        ret.push(...await forumTopic);
        ret.push(...await beatmapset);

        return ret;
    }

    private beatmapsetSubscriptions = async () => {
        const [rows, fields] = await this.config.db.execute(`
            SELECT beatmapset_id
            FROM beatmapset_watches
            WHERE user_id = ?
        `, [this.userId]);

        return rows.map((row: any) => {
            return `beatmapset:${row.beatmapset_id}`;
        });
    }

    private forumTopicSubscriptions = async () => {
        const [rows, fields] = await this.config.db.execute(`
            SELECT topic_id
            FROM phpbb_topics_watch
            WHERE user_id = ?
        `, [this.userId]);

        return rows.map((row: any) => {
            return `forum_topic:${row.topic_id}`;
        });
    }
}
