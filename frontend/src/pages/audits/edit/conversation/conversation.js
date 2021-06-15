import { Notify, Dialog } from 'quasar';

import Breadcrumb from 'components/breadcrumb';
import BasicEditor from 'components/editor';

import AuditService from '@/services/audit';
import Utils from '@/services/utils';

export default {
    props: {
        isReviewing: Boolean,
		isEditing: Boolean,
		isApproved: Boolean,
		isReadyForReview: Boolean,
        fullyApproved: Boolean
    },
    data: () => {
        return {
            // Set audit ID
            auditId: null,
            // Current editing audit object
            feed: [],
            feedOrig: [],
            post: {
                type: "message",
                content: ""
            }
        }
    },

    components: {
        Breadcrumb,
        BasicEditor
    },

    mounted: function() {
        this.auditId = this.$route.params.auditId;
        this.getAuditFeed();

        this.$socket.emit('menu', {menu: 'feed', room: this.auditId});
    },

    destroyed: function() {
        document.removeEventListener('keydown', this._listener, false)
    },

    methods: {
        _listener: function(e) {
            if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
                e.preventDefault();
                this.updateAuditNetwork();
            }
        },

        // Get Audit datas from uuid
        getAuditFeed: function() {
            AuditService.getAuditConversation(this.auditId)
            .then((data) => {
                this.feed = data.data.datas;
                this.feedOrig = this.$_.cloneDeep(this.audit);
            })
            .catch((err) => {
                console.log(err)
            })
        },

        sendPost: function() {
            Utils.syncEditors(this.$refs);

            this.$nextTick(() => {
                AuditService.postAuditConversation(this.auditId, this.post)
                .then(res => {
                    this.feed = [...this.feed, res.data.datas];
                    this.post.content = "";

                    Utils.syncEditors(this.$refs);
                }).catch(err => {
                    console.log(err);
                })
            });
        }
    }
}
