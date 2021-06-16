import { Notify, Dialog } from 'quasar';
import moment from 'moment';

import Breadcrumb from 'components/breadcrumb';
import BasicEditor from 'components/editor';

import UserService from '@/services/user';
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
            conversation: [],
            conversationOrig: [],
            post: {
                type: "message",
                content: ""
            },
            deleteDialog: false,
            deletePostId: null
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

        // Includes frontend data to post.
        convertPost: function(post) {
            return { 
                ...post, 
                user: {
                    ...post.user, 
                    me: post.user._id === UserService.user.id
                },
                date: moment(post.createdAt).fromNow(),
                edited: post.createdAt != post.updatedAt,
                edit: false 
            };
        },

        // Get Audit datas from uuid
        getAuditConversation: function() {
            AuditService.getAuditConversation(this.auditId)
            .then((data) => {
                this.conversation = data.data.datas.map(post => this.convertPost(post));
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
                    this.conversation = [...this.conversation, this.convertPost(res.data.datas)];
                    this.post.content = "";

                    this.$nextTick(() => {
                        Utils.syncEditors(this.$refs);
                    });
                }).catch(err => {
                    console.log(err);
                })
            });
        },

        // Toggles post edit state.
        editAuditConversationPost: function(post) {
            post.edit = !post.edit;

            if(!post.edit) {
                Utils.syncEditors(this.$refs);

                this.$nextTick(() => {
                    AuditService.updateAuditConversation(this.auditId, post._id, post)
                    .then(res => {
                        const newPost = this.convertPost(res.data.datas);

                        this.conversation = this.conversation.map(p => (p._id === post._id ? newPost : p));

                        Notify.create({
                            message: 'Post updated successfully',
                            color: 'positive',
                            textColor:'white',
                            position: 'top-right'
                        })
                    })
                    .catch((err) => {
                        Notify.create({
                            message: "Post update failed",
                            color: 'negative',
                            textColor: 'white',
                            position: 'top-right'
                        });
                    })
                });
            }
        },

        // Opens delete dialog box.
        deleteAuditConversationPostDialog: function(post) {
            this.deleteDialog = true;
            this.deletePostId = post._id;
        },

        // Deletes post from conversation.
        deleteAuditConversationPost: function() {
            AuditService.deleteAuditConversation(this.auditId, this.deletePostId)
            .then((data) => {
                this.conversation = this.conversation.filter(post => post._id !== this.deletePostId);

                Notify.create({
                    message: 'Post deleted successfully',
                    color: 'positive',
                    textColor:'white',
                    position: 'top-right'
                })
            })
            .catch((err) => {
                Notify.create({
                    message: "Post delete failed",
                    color: 'negative',
                    textColor: 'white',
                    position: 'top-right'
                });
            })
        }
    }
}
