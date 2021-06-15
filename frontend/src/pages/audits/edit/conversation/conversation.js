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
            conversation: [],
            conversationOrig: [],
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
        this.getAuditConversation();

        this.$socket.emit('menu', {menu: 'conversation', room: this.auditId});
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
        getAuditConversation: function() {
            AuditService.getAuditConversation(this.auditId)
            .then((data) => {
                this.conversation = data.data.datas;
                this.conversationOrig = this.$_.cloneDeep(this.audit);
            })
            .catch((err) => {
                console.log(err)
            })
        },

        // Sends post to audit conversation.
        sendAuditConversationPost: function() {
            Utils.syncEditors(this.$refs);

            this.$nextTick(() => {
                // Prevents posting of empty string (client-side).
                if(this.post.conent === '') return;

                AuditService.postAuditConversation(this.auditId, this.post)
                .then(res => {
                    this.conversation = [...this.conversation, res.data.datas];
                    this.post.content = "";

                    this.$nextTick(() => {
                        Utils.syncEditors(this.$refs);
                    });
                }).catch(err => {
                    console.log(err);
                })
            });
        }
    }
}
